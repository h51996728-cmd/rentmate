FROM ruby:3.3-alpine

WORKDIR /app
RUN gem install webrick --no-document
COPY index.html ./
COPY server.rb ./
COPY src ./src
ENV PORT=10000
ENV DATA_DIR=/var/data
EXPOSE 10000
CMD ["ruby", "server.rb"]
