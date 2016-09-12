import oracledb from 'oracledb';
import dbConfig from './dbconfig';

oracledb.outFormat = oracledb.OBJECT;

function getConnection(){
  return oracledb.getConnection({
    user          : dbConfig.user,
    password      : dbConfig.password,
    connectString : dbConfig.connectString
  });
};

function doRelease(connection){
  connection.release(
    function(err){
      if (err) { console.error(err.message); }
    }
  );
}

function doClose(connection, resultSet){
  resultSet.close(
    function(err){
      if (err) { console.error(err.message); }
      doRelease(connection);
    }
  );
}

function getParams(params){
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
}

function getClobData(clob){
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

export function executeReader(procName, params, columnName){
  return new Promise((resolve, reject) => {
    getConnection()
    .then(connection => {
      //Parameters:
      var parameters = getParams(params);
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
              promises.push(getClobData(clob));
            });
            Promise.all(promises).then(responses => {
              response.data.forEach((item, index) => {
                item[columnName] = responses[index];
              });
              doRelease(connection);
              resolve(response);
            });
          } else {
            doRelease(connection);
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
}

export function executeReaderLob(procName, params, columnName){
  return executeReader(procName, params, columnName);
}

export function executeNonQuery(procName, params){
  return new Promise((resolve, reject) => {
    getConnection()
    .then(connection => {
      //Parameters:
      var parameters = getParams(params);
      //Execute:
      connection.execute(
        `BEGIN ${procName}(${parameters.bindVar}); END;`,
        parameters.params || {},
        { autoCommit: true }
      ).then(result => {
        doRelease(connection);
        resolve();
      })
      .catch(err => {
        reject(err);
      });
    });
  });
}

export function executeFunction(funcName, params, outMaxSize){
  return new Promise((resolve, reject) => {
    getConnection()
      .then(connection => {
        var parameters = getParams(params);
        parameters.params.return = {dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: outMaxSize || 4000};
        connection.execute(
          `BEGIN :return := ${funcName}(${parameters.bindVar}); END;`,
          parameters.params || {}
        ).then(result => {
          doRelease(connection);
          resolve(result.outBinds.return);
        })
        .catch(err => {
          reject(err);
        });
      })
  });
}
