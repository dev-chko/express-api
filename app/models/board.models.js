const sql = require('./CMS_db.js');
const dayjs = require('dayjs');

const Board = function (board) {};
Board.getAll = (request, result) => {
  const { lang, pageCount, pageIndex, type } = request;
  var content = '';
  var language = '';
  type === 'all' ? (content = '') : (content = `type='${type}' and`);
  lang === 'all' ? (language = '') : (language = `lang='${lang}'`);
  if (type && lang === 'all') {
    content = '1=';
    language = '1';
  }
  let start = pageIndex === 1 ? 0 : (pageIndex - 1) * pageCount;
  let end = pageCount * pageIndex;
  let sql_query = `SELECT * FROM tb_notices where (${content} ${language}) order by date desc Limit ${start}, ${end};`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Board.getTotal = (request, result) => {
  const { lang, pageCount, pageIndex, type } = request;
  type === 'all' ? (content = '') : (content = `type='${type}' and`);
  lang === 'all' ? (language = '') : (language = `type=${lang}`);
  if (type && lang === 'all') {
    content = '1=';
    language = '1';
  }
  let sql_query = `SELECT count(*) as total FROM tb_notices where (${content} lang='${lang}');`;
  sql.query(sql_query, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Board.newNotice = (NewTable, result) => {
  var now = dayjs();
  const newData = { ...NewTable };
  const regData = now.format('YYYY-MM-DD HH:mm:ss');
  newData.date = regData;
  sql.query(`Insert Into tb_notices SET ?`, newData, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, { id: res.insertId });
  });
};

Board.editNotice = (id, NewTable, result) => {
  const newData = { ...NewTable };
  // const regData = now.format('YYYY-MM-DD HH:mm:ss')
  // newData.date = regData
  // console.log(newData)
  sql.query(`Update tb_notices SET ? where id=${id}`, newData, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, { id: res.changedRows });
  });
};

Board.deleteNotice = (id, result) => {
  sql.query(`DELETE FROM tb_notices WHERE id=${id}`, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

Board.findNotice = (id, result) => {
  sql.query(`SELECT * FROM tb_notices where id=${id}`, (err, res) => {
    if (err) {
      console.error(err);
      result(err, null);
      return;
    }
    result(null, res);
  });
};

module.exports = Board;
