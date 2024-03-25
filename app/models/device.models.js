const sql = require('./CMS_db.js');

exports.register = (data, result) => {
  const { mIdx, email, deviceToken, voipToken, brand, model, os, osVersion, appVersion, appBuild, carrier, ip, cameraPresent } = data;
  const query =
    `INSERT INTO tb_devices (mIdx, email, deviceToken, voipToken, brand, model, os, osVersion, appVersion, appBuild, carrier, ip, cameraPresent )` +
    ` VALUES(${mIdx}, '${email}', '${deviceToken}', '${voipToken}', '${brand}', '${model}', '${os}', '${osVersion}', '${appVersion}', '${appBuild}', '${carrier}', '${ip}', ${cameraPresent})` +
    ` ON DUPLICATE KEY UPDATE deviceToken='${deviceToken}', voipToken='${voipToken}', brand='${brand}', model='${model}', osVersion='${osVersion}', appVersion='${appVersion}', appBuild='${appBuild}', carrier='${carrier}', ip='${ip}', cameraPresent=${
      cameraPresent || false
    }`;
  sql.query(query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, { did: res.insertId });
  });
};

exports.getList = (request, result) => {
  var casebyEmail = '';
  request ? (casebyEmail = `where email='${request}'`) : null;
  const query = `select * from tb_devices ${casebyEmail}`;
  sql.query(query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};
