const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dateFor = require("date-fns");
const moment = require("moment");
const path = require("path");
// console.log(dateFor.format(new Date(2021, 5 - 1, 12), "yyyy/MM/dd"));
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
    requestQuery.status !== undefined &&
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
  //   let invalidUpdate = null;
  if (requestQuery.priority !== undefined) {
    return true;
  }
  // else {
  //     return (invalidUpdate = "Priority");
  //   }
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
const convertDbObjectToResponseObject = (each) => {
  return {
    id: each.id,
    todo: each.todo,
    status: each.status,
    priority: each.priority,
    category: each.category,
    dueDate: each.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let todos = null;
  //   let invalidUpdate = null;?
  let getTodosQuery = "";
  const { search_q = "", priority, status, category, date } = request.query;
  console.log({ search_q, priority, status, category, date });
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
        AND due_date = '${date}';`;
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
  if (todos !== undefined) {
    response.send(todos.map((each) => convertDbObjectToResponseObject(each)));
  } else {
    console.log(`${todos} wrong`);
    response.status(400);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const getQuery = `
  SELECT * FROM todo WHERE id=${todoId}
  `;
  const todos = await database.get(getQuery);
  response.send({
    id: todos.id,
    todo: todos.todo,
    status: todos.status,
    priority: todos.priority,
    category: todos.category,
    dueDate: todos.due_date,
  });
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const forDate = dateFor.format(new Date(date), "yyyy-MM-dd");
  console.log(`${forDate} new date`);

  const getQuery = `
  SELECT * FROM todo WHERE due_date = "${forDate}"
  `;
  const todo = await database.all(getQuery);
  console.log(todo);

  response.send(todo.map((each) => convertDbObjectToResponseObject(each)));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, dueDate, category } = request.body;
  console.log(request.body);
  const addQuery = `INSERT INTO todo(id,todo,priority,status,category,due_date)
    VALUES( 
        "${id}",
"${todo}",
"${priority}",
"${status}",
"${category}",
"${dueDate}"
    );`;
  console.log(`${addQuery} posting query`);
  const dbRes = await database.run(addQuery);

  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  console.log(moment(requestBody.dueDate, "yyyy-MM-dd").isValid());
  let upCol = null;
  switch (true) {
    case requestBody.todo !== undefined:
      upCol = "Todo";
      break;
    case requestBody.status !== undefined:
      upCol = "Status";
      break;
    case requestBody.priority !== undefined:
      upCol = "Priority";
      break;
    case requestBody.category !== undefined:
      upCol = "Category";
      break;
    case requestBody.dueDate !== undefined:
      upCol = "Due Date";
      break;
  }

  const getQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const prevQuery = await database.get(getQuery);
  const {
    todo = prevQuery.todo,
    priority = prevQuery.priority,
    category = prevQuery.category,
    status = prevQuery.status,
    dueDate = prevQuery.due_date,
  } = request.body;
  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${upCol} Updated`);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `DELETE FROM todo WHERE id=${todoId}`;
  await database.run(getQuery);
  response.send("Todo Deleted");
});

module.exports = app;
