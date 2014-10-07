'use strict';

// $ createuser root
// $ psql -U root -d postgres
// > CREATE DATABASE agave_test;
// > \q

if (!/^(1|true)$/i.test(process.env.TEST_POSTGRES || '1')) { return; }

var expect = require('chai').expect;
var Database = require('../../../lib/db/database');

describe('PostgresQL', function() {
  it('connects to the database', function(done) {
    var connection = {
      adapter: 'pg',
      username: 'root',
      password: '',
      database: 'agave_test'
    };
    var db = Database.create(connection);
    db.ready().then(function(db2) {
      expect(db).to.eql(db2);
      expect(db._adapter._client).to.exist;
      return db.disconnect();
    })
    .done(done, done);
  });
});
