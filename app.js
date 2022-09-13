const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dateFor = require("date-fns");
const path = require("path");
console.log(dateFor.format(new Date(2021, 5, 12), "yyyy/MM/dd"));
const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityStatusCategoryDuedateProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined &&
    requestQuery.due_date !== undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.date !== undefined
  );
};

const hasPriorityStatusCategoryProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasDuedateProperty = (requestQuery) => {
  console.log(requestQuery.date);
  // if requestQuery.date!== undefined{
  //     return requestQuery.date !== undefined;
  // }else{
  //     return "Invalid DueDate"
  // }
  return requestQuery.date !== undefined;
};

app.get("/todos/", async (request, response) => {
  let todos = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category, date } = request.query;

  switch (true) {
    case hasPriorityStatusCategoryDuedateProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}'
        AND category = '${category}'
        AND due_date = '${due_date}';`;
      break;
    case hasPriorityStatusCategoryProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}'
        AND category = '${category}'
        ;`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      break;
    case hasDuedateProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND due_date = '${date}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  todos = await database.all(getTodosQuery);
  response.send(todos);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const getQuery = `
  SELECT * FROM todo WHERE id=${todoId}
  `;
  const todo = await database.get(getQuery);
  response.send(todo);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const forDate = dateFor.format(new Date(date), "yyyy/MM/dd");
  console.log(request.query);
  console.log(forDate);

  const getQuery = `
  SELECT * FROM agenda WHERE due_date = "${forDate}"
  `;
  const todo = await database.all(getQuery);
  console.log(todo);

  response.send(todo);
});

module.exports = app;
