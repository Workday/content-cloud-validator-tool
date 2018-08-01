'use strict';

const hippie = require('hippie');
const expect = require('chai').expect;
const {URL} = require('url');
const sanitizeHtml = require('sanitize-html');
const tokenService = require('./token-service');

describe('Specification conformance', function () {

  // Process incoming arguments
  const baseUrl = process.env.npm_config_endpoint ||
    process.env.WDAY_CC_TEST_ENDPOINT ||
    'http://localhost:8080/api/contents?filter=' +
    encodeURIComponent(JSON.stringify({"limit": 1000, "skip": 0}));
  let token = process.env.npm_config_token ||
    process.env.WDAY_CC_TEST_TOKEN ||
    '';

  if (!token || token.length < 1) {
    // If no token, let's generate a default token
    tokenService(function(newToken) {
      token = newToken;
    });
  }

  let client;

  beforeEach(function (done) {
    hippie.assert.showDiff = true;
    client = hippie()
      .time(true)
      .header("Content-Type", "application/vnd.workday.contentcloud.v1+json")
      .json()
      .get(baseUrl);
    done();
  });

  describe('Basic connectivity and security test cases', function () {

    it('MUST not timeout after 30secs', function (done) {
      client.timeout(30000)
        .end(done);
    });

    it('SHOULD reject missing token', function (done) {
      client.expectStatus(401)
        .end(done)
    });
  });

  describe('Authentication test cases', function () {

    it('SHOULD accept a JWT via Authorization Header', function (done) {
      client.expectStatus(200)
        .header('Authorization', 'Bearer ' + token)
        .end(done);
    });

    it('MUST not accept a bad JWT via Authorization Header', function (done) {
      client.header('Authorization', 'Bearer 123.123.123')
        .expectStatus(401)
        .end(done);
    });

    it('MUST not accept a malformed Authorization Header', function (done) {
      client.header('Authorization', 'Bearer ')
        .expectStatus(401)
        .end(done);
    });
  });

  describe('Content type validation test cases', function () {

    it('MUST return a specific Content-Type response headers', function (done) {
      client.header('Authorization', 'Bearer ' + token)
        .expectStatus(200)
        .expectHeader('Content-Type', 'application/vnd.workday.contentcloud.v1+json; charset=utf-8')
        .end(done);
    });
  });

  describe('Response body data validation test cases', function () {

    let contents = [];

    it('MUST return the entire contents', function (done) {

      this.timeout(60000); // 60 seconds timeout
      function next(url) {
        client.get(url)
          .header('Authorization', 'Bearer ' + token)
          .expectStatus(200)
          .end(function (err, res, body) {
            if (err) throw err;

            expect(body).to.be.an('array');

            // We'll append all pages together
            for (let i = 0; i < body.length; i++) {
              contents.push(body[i]);
            }

            // Check for link header (used for pagination)
            if (res.headers.link) {
              next(res.headers.link);
            } else {
              done();
            }
          });
      }
      next(baseUrl);
    });

    it('MUST return all required JSON elements and not be empty', function (done) {

      for (let i = 0; i < contents.length; i++) {
        const content = contents[i];
        expect(content).to.have.property('id');
        if (content.id.length) {
          expect(content.id.length).to.be.at.least(1);
        }
        expect(content).to.have.property('title');
        expect(content.title.length).to.be.at.least(1);
        expect(content).to.have.property('description');
        expect(content.description.length).to.be.at.least(1);
        expect(content).to.have.property('contentType');
        expect(content.contentType.length).to.be.at.least(1);
        expect(content).to.have.property('playbackType');
        expect(content.playbackType.length).to.be.at.least(1);
        expect(content).to.have.property('webPlaybackUrl');
        expect(content.webPlaybackUrl.length).to.be.at.least(1);
      }

      done();
    });

    it('MUST have not too long strings', function (done) {

      for (let i = 0; i < contents.length; i++) {
        const content = contents[i];

        expect(content).to.have.property('id');
        if (content.id.length) {
          expect(content.id.length).to.be.at.most(128);
        }
        expect(content).to.have.property('title');
        expect(content.title.length).to.be.at.most(200);
        expect(content).to.have.property('description');
        expect(content.description.length).to.be.at.most(5000);
        expect(content).to.have.property('contentType');
        expect(content.contentType.length).to.be.at.most(6);
        expect(content).to.have.property('playbackType');
        expect(content.playbackType.length).to.be.at.most(8);
        expect(content).to.have.property('webPlaybackUrl');
        expect(content.webPlaybackUrl.length).to.be.at.most(2048);
        if (content.mobilePlaybackUrl.length) {
          expect(content.mobilePlaybackUrl.length).to.be.at.most(2048);
        }
        if (content.channelTitle) {
          expect(content.channelTitle.length).to.be.at.most(200);
        }
      }

      done();
    });

    it('MUST have correct enumerations', function (done) {

      for (let i = 0; i < contents.content; i++) {
        const content = contents[i];
        expect(content.contentType).to.be.oneOf(['video', 'audio', 'course']);
        expect(content.playbackType).to.be.oneOf(['workday', 'iframe', 'external']);
      }

      done();
    });

    it('MUST have properly formats URLs', function (done) {

      for (let i = 0; i < contents.length; i++) {
        const content = contents[i];
        expect(content.webPlaybackUrl).to.satisfy(function (parseUrl) {
          // Try parsing, if it fails it will throw an error failing this test case
          const urlObject = new URL(parseUrl);
          return urlObject.protocol === "https:";
        }, content.webPlaybackUrl);
        if (content.mobilePlaybackUrl && content.mobilePlaybackUrl.length > 0) {
          expect(content.mobilePlaybackUrl).to.satisfy(function (parseUrl) {
            // Try parsing, if it fails it will throw an error failing this test case
            new URL(parseUrl);
            return true;
          });
        }
        if (content.thumbnails) {
          content.thumbnails.every(thumbnail => {
            if (thumbnail.url && thumbnail.url.length > 0) {
              expect(thumbnail.url).to.satisfy(function (parseUrl) {
                // Try parsing, if it fails it will throw an error failing this test case
                const urlObject = new URL(parseUrl);
                return urlObject.protocol === "https:";
              });
            }
          });
        }
      }

      done();
    });

    it('SHOULD have NOT have disallowed HTML tags', function (done) {
      // setup rules for HTML filtering
      const santizeOptions = {
        allowedTags: [ 'h1', 'h2', 'h3', 'p', 'strong', 'i', 'u', 'span', 'ul', 'li' ],
      };

      for (let i = 0; i < contents.length; i++) {
        const content = contents[i];

        // test the description
        const cleanDescription = sanitizeHtml(content.description, santizeOptions);

        // if the string are different lengths, it means we've done some cleaning.
        try {
          expect(cleanDescription).to.equal(content.description);
        } catch (e) {
          console.warn('Warning: we detected disallowed HTML in the `description` for content item id: ', content.id);
          console.warn('Original: ', content.description);
          console.warn('Sanitized: ', cleanDescription);
        }
      }

      done();
    });
  });
});
