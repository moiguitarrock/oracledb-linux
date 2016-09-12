var oracledb = require('oracledb');
var dbConfig = require('./dbconfig.js');
oracledb.outFormat = oracledb.OBJECT;

var dbHelper = {
  getConnection: function(){
    return oracledb.getConnection({
      user          : dbConfig.user,
      password      : dbConfig.password,
      connectString : dbConfig.connectString
    });
  },
  doRelease: function(connection){
    connection.release(
      function(err){
        if (err) { console.error(err.message); }
      }
    );
  },
  doClose: function(connection, resultSet){
    resultSet.close(
      function(err){
        if (err) { console.error(err.message); }
        dbHelper.doRelease(connection);
      }
    );
  },
  getParams: params => {
    //Parameters:
    var bindVar = '';
    for (var p in params){
      if (params.hasOwnProperty(p)) {
        bindVar += " :" + p + ",";
        if (p.toUpperCase() === 'CRETURN') {
          params[p] = { type: oracledb.CURSOR, dir : oracledb.BIND_OUT };
        }
      }
    }
    return { params: params, bindVar: bindVar.slice(0, -1) };
  },
  executeReader: (procName, params, columnName) => {
    return new Promise((resolve, reject) => {
      dbHelper.getConnection()
      .then(connection => {
        //Parameters:
        var parameters = dbHelper.getParams(params);
        //Execute:
        connection.execute(
          `BEGIN ${procName}(${parameters.bindVar}); END;`,
          parameters.params || {}
        ).then(result => {
          var response = {
            meta: result.outBinds.creturn.metaData,
            data: []
          };
          var stream = result.outBinds.creturn.toQueryStream();

          stream.on('data', data => {
            response.data.push(data);
          });

          stream.on('error', error => {
            console.log('stream error: ' + error);
            reject(error)
          });

          stream.on('end', () => {
            if (columnName) {
              var promises = [];
              response.data.forEach(item => {
                var clob = item[columnName];
                promises.push(dbHelper.getClobData(clob));
              });
              Promise.all(promises).then(responses => {
                response.data.forEach((item, index) => {
                  item[columnName] = responses[index];
                });
                dbHelper.doRelease(connection);
                resolve(response);
              });
            } else {
              dbHelper.doRelease(connection);
              resolve(response);
            }
          });
        })
        .catch(err => {
          if (err) {
            console.error(err.message);
            dbhelper.doRelease(connection);
            reject(err.message)
          }
        });
      })
      .catch(err => {
        if (err) {
          console.error(err.message);
          reject(err)
        }
      });
    });
  },
  executeReaderLob: (procName, params, columnName) => {
    return dbHelper.executeReader(procName, params, columnName);
  },
  executeNonQuery: (procName, params) => {
    return new Promise((resolve, reject) => {
      dbHelper.getConnection()
      .then(connection => {
        //Parameters:
        var parameters = dbHelper.getParams(params);
        //Execute:
        connection.execute(
          `BEGIN ${procName}(${parameters.bindVar}); END;`,
          parameters.params || {},
          { autoCommit: true }
        ).then(result => {
          dbHelper.doRelease(connection);
          resolve();
        })
        .catch(err => {
          reject(err);
        });
      });
    });
  },
  executeFunction: (funcName, params, outMaxSize) => {
    return new Promise((resolve, reject) => {
      dbHelper.getConnection()
        .then(connection => {
          var parameters = dbHelper.getParams(params);
          parameters.params.return = {dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: outMaxSize || 4000};
          connection.execute(
            `BEGIN :return := ${funcName}(${parameters.bindVar}); END;`,
            parameters.params || {}
          ).then(result => {
            dbHelper.doRelease(connection);
            resolve(result.outBinds.return);
          })
          .catch(err => {
            reject(err);
          });
        })
    });
  },
  getClobData: clob => {
    return new Promise((resolve, reject) => {
      var data = "";
      clob.setEncoding('utf8');
      clob.on('data', clobData => {
        data = clobData;
      });
      clob.on('error', err => {
        reject(err);
      });
      clob.on('end', () =>{
        resolve(data);
      });
    });
  }
};

module.exports = dbHelper;
