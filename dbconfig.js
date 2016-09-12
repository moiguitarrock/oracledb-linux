module.exports = {
  user: process.env.NODE_ORACLEDB_USER || "HEALTHQA",
  password: process.env.NODE_ORACLEDB_PASSWORD || "HEALTHQA",
  connectString: process.env.NODE_ORACLEDB_CONNECTIONSTRING || "10.21.100.197:1521/PDB_CEBTEST01",
  externalAuth  : process.env.NODE_ORACLEDB_EXTERNALAUTH ? true : false
};
