(function() {
  var SQLstringify, field_value_mapper, sys, _;
  sys = require("sys");
  _ = require(__dirname + "/../lib/underscore/underscore.js");
  exports.createRingBuffer = function(length) {
    var buffer, pointer, ret;
    pointer = 0;
    buffer = [];
    ret = {
      push: function(item) {
        buffer[pointer] = item;
        return pointer = (length + pointer + 1) % length;
      },
      get: function() {
        return buffer;
      },
      len: function() {
        var elements, val, _i, _len;
        elements = 0;
        for (_i = 0, _len = buffer.length; _i < _len; _i++) {
          val = buffer[_i];
          if (val !== void 0) {
            elements += 1;
          }
        }
        return elements;
      },
      avg: function() {
        var elements, sum, val, _i, _len;
        sum = 0.0;
        elements = 0.0;
        for (_i = 0, _len = buffer.length; _i < _len; _i++) {
          val = buffer[_i];
          if (val !== void 0) {
            sum += val;
            elements += 1;
          }
        }
        if (elements < 1) {
          return sum;
        } else {
          return sum / elements;
        }
      }
    };
    return ret;
  };
  exports.decodeBase64Authorization = function(authheader) {
    var auth, ret, value;
    if (!authheader) {
      return null;
    }
    value = authheader.match("^Basic\\s([A-Za-z0-9+/=]+)$");
    if (value) {
      auth = new Buffer(value[1] || "", "base64").toString("ascii");
      ret = {
        username: auth.slice(0, auth.indexOf(":")),
        password: auth.slice(auth.indexOf(":") + 1, auth.length)
      };
      return ret;
    } else {
      return null;
    }
  };
  exports.sendError = function(resp, error, status) {
    console.log('# error: ' + error + ': ' + status);
    resp.writeHead(status || 500, {
      'Content-Type': 'application/json; encoding=utf-8'
    });
    resp.end(JSON.stringify({
      'success': false,
      'error': error
    }));
    return false;
  };
  exports.sendError = function(resp, error, status) {
    console.log("# error: " + error + ": " + status);
    resp.writeHead(status || 500, {
      'Content-Type': "application/json"
    });
    resp.end(JSON.stringify({
      success: false,
      error: error
    }));
    return false;
  };
  exports.parseJSON = function(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.log(error);
    }
  };
  exports.buildSqlInsert = function(table, data) {
    var fields, mapper, values;
    if (data === void 0 || !data.conditions || !data.values) {
      return '';
    }
    fields = [];
    values = [];
    mapper = function(value, field) {
      fields.push(field);
      return values.push(SQLstringify(value));
    };
    _.each(data.conditions, mapper);
    _.each(data.values, mapper);
    return "INSERT INTO " + table + " (" + fields.join(", ") + ") VALUES (" + values.join(",") + ")";
  };
  exports.buildSqlUpdate = function(table, data) {
    var conditions, values;
    conditions = _.map(data.conditions, field_value_mapper).join(' AND ');
    values = _.map(data.values, field_value_mapper).join(',');
    if (data === void 0 || !data.conditions || !data.values) {
      return '';
    }
    return 'UPDATE "' + table + '" SET ' + values + ' WHERE ' + conditions;
  };
  exports.execSqlCount = function(client, table, query, callback) {
    var conditions, sql;
    conditions = _.map(query.conditions, field_value_mapper).join(' AND ');
    sql = "SELECT COUNT(*) FROM " + table + " WHERE " + conditions;
    return client.query(sql, function(err, rs) {
      var rowCnt;
      rowCnt = 0;
      if (!err) {
        rowCnt = rs.rows[0].count;
      }
      return callback(err, query, rowCnt);
    });
  };
  SQLstringify = function(value) {
    switch (typeof value) {
      case 'string':
        return "'" + value.replace("'", "''") + "'";
      case 'number':
      case 'boolean':
      case 'null':
        return String(value);
      default:
        return String(value);
    }
  };
  field_value_mapper = function(value, field) {
    return field + "=" + SQLstringify(value);
  };
}).call(this);
