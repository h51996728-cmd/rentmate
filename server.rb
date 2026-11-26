require 'webrick'
require 'json'
require 'securerandom'
require 'thread'

ROOT = File.expand_path(__dir__)
DATA_DIR = ENV.fetch('DATA_DIR', ROOT)
Dir.mkdir(DATA_DIR) unless Dir.exist?(DATA_DIR)
DATA_FILE = File.join(DATA_DIR, 'rentmate-listings.json')
LOCK = Mutex.new

def load_listings
  File.exist?(DATA_FILE) ? JSON.parse(File.read(DATA_FILE)) : []
end

def save_listings(items)
  temp_file = "#{DATA_FILE}.tmp"
  File.write(temp_file, JSON.pretty_generate(items))
  File.rename(temp_file, DATA_FILE)
end

def json_response(response, status, data)
  response.status = status
  response['Content-Type'] = 'application/json; charset=utf-8'
  response['Cache-Control'] = 'no-store'
  response.body = JSON.generate(data)
end

server = WEBrick::HTTPServer.new(Port: ENV.fetch('PORT', '8000').to_i, BindAddress: '0.0.0.0', AccessLog: [], Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN))
server.mount_proc('/') do |request, response|
  path = request.path
  if path == '/api/listings' && request.request_method == 'GET'
    items = LOCK.synchronize { load_listings }
    public_items = items.map { |item| item.reject { |key, _| key == 'address' } }
    json_response(response, 200, public_items)
  elsif path == '/api/listings' && request.request_method == 'POST'
    begin
      body = JSON.parse(request.body || '{}')
      required = %w[name category price deposit address image]
      unless required.all? { |key| body[key] && !body[key].to_s.strip.empty? } && %w[Gardening Construction].include?(body['category']) && body['image'].is_a?(String) && body['image'].start_with?('data:image/')
        next json_response(response, 400, { error: 'Please provide a photo and complete, valid listing details.' })
      end
      item = {
        id: body['id'].to_s.empty? ? SecureRandom.uuid : body['id'].to_s,
        name: body['name'].to_s.strip[0, 120], category: body['category'],
        price: [body['price'].to_i, 1].max, deposit: [body['deposit'].to_i, 0].max,
        address: body['address'].to_s.strip[0, 500], owner: body['owner'].to_s[0, 100].then { |name| name.empty? ? 'RentMate member' : name },
        image: body['image'], rating: 'New', reviews: 0, tone: 'green'
      }
      LOCK.synchronize do
        items = load_listings
        unless items.any? { |existing| existing['id'] == item[:id] }
          items.unshift(item.transform_keys(&:to_s))
          save_listings(items)
        end
      end
      json_response(response, 201, item.reject { |key, _| key == :address })
    rescue JSON::ParserError, TypeError
      json_response(response, 400, { error: 'Invalid listing data.' })
    end
  elsif path.start_with?('/api/demo-checkout/') && request.request_method == 'POST'
    id = path.split('/').last
    item = LOCK.synchronize { load_listings.find { |listing| listing['id'] == id } }
    item ? json_response(response, 200, { address: item['address'], demo: true }) : json_response(response, 404, { error: 'Listing not found.' })
  elsif request.request_method == 'GET'
    relative_path = path == '/' ? 'index.html' : path.sub(%r{\A/}, '')
    file_path = File.expand_path(relative_path, ROOT)
    unless file_path.start_with?(ROOT + File::SEPARATOR) && File.file?(file_path)
      next json_response(response, 404, { error: 'Not found.' })
    end
    response.status = 200
    response['Content-Type'] = WEBrick::HTTPUtils.mime_type(file_path, WEBrick::HTTPUtils::DefaultMimeTypes)
    response['Cache-Control'] = 'no-store'
    response.body = File.binread(file_path)
  else
    json_response(response, 405, { error: 'Method not allowed.' })
  end
end

trap('INT') { server.shutdown }
trap('TERM') { server.shutdown }
puts "RentMate is listening on port #{ENV.fetch('PORT', '8000')}"
server.start
