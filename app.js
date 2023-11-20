const express = require("express");
const app = express();
//const bcrypt = require("bcrypt");
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const filePath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    (db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    })),
      app.listen(3000, () => {
        console.log("Server is running at port 3000");
      });
  } catch (error) {
    console.log(`DB Error - ${error.message}`);
  }
};
initializeDBAndServer();

const validation = (request, response, next) => {
  const { priority, status, category, date, search_q } = request.query;
  const priority_arr = ["HIGH", "MEDIUM", "LOW"];
  const status_arr = ["TO DO", "IN PROGRESS", "DONE"];
  const category_arr = ["WORK", "HOME", "LEARNING"];
  if (priority !== undefined) {
    if (priority_arr.includes(priority) === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if(search_q !== undefined){
    request.search_q = search_q;
  } else{
    request.search_q = "";
  }
  if (status !== undefined) {
    if (status_arr.includes(status) === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (category !== undefined) {
    if (category_arr.includes(category) === true) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (date !== undefined) {
    const dates = new Date(date);
    const myDate = format(dates, "yyyy-MM-dd");
    const year = myDate.getFullYear();
    const month = myDate.getMonth() + 1;
    const date = myDate.getDate();
    const finalDate = new Date(year, month, date);
    console.log(finalDate);
    if (isValid(new Date(finalDate)) === true) {
      request.myDate = myDate;
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
  
  next();
};

//API 1
app.get("/todos/", validation, async (request, response) => {
  const {
    priority = "",
    status = "",
    category = "",
    search_q = "",
  } = request;
  const dbQuery = `SELECT id,todo,category,priority,status,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;
  const dbResponse = await db.all(dbQuery);
  response.send(dbResponse);
});
//API 2
app.get("/todos/:todoId/", validation, async (request, response) => {
  const { todoId } = request.params;
  const dbQuery = `SELECT id,todo,category,priority,status,due_date AS dueDate FROM todo WHERE id = ${todoId};`;
  const dbResponse = await db.get(dbQuery);
  response.send(dbResponse);
});

//API 3
app.get("/agenda/", validation, async (request, response) => {
  const { date = "" } = request.query;
  const dbQuery = `SELECT id,todo,category,priority,status,due_date AS dueDate FROM todo WHERE due_date='${date}';`;
  const dbResponse = await db.get(dbQuery);
  response.send(dbResponse);
});
//API 4
app.post("/todos/", validation, async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const dbQuery = `INSERT INTO todo (id,todo,category,priority,status,due_date) VALUES (${id},'${todo}','${category}','${priority}','${status}','${dueDate}');`;
  const dbResponse = await db.run(dbQuery);
  response.send("Todo Successfully Added");
});

//API 5
app.put("/todos/:todoId/", validation, async (request, response) => {
  const { todoId } = request.params;
  const {
    todo = "",
    priority = "",
    status = "",
    category = "",
    dueDate = "",
  } = request.query;
  let dbQuery = null;
  switch (true) {
    case priority !== "":
      dbQuery = `UPDATE todo SET priority = '${priority}' WHERE id = ${todoId};`;
      await db.run(dbQuery);
      response.send("Priority Updated");
      break;
    case status !== "":
      dbQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId};`;
      await db.run(dbQuery);
      response.send("Status Updated");
      break;
    case category !== "":
      dbQuery = `UPDATE todo SET category = '${category}' WHERE id = ${todoId};`;
      await db.run(dbQuery);
      response.send("Category Updated");
      break;
    case dueDate !== "":
      dbQuery = `UPDATE todo SET due_date = '${dueDate}' WHERE id = ${todoId};`;
      await db.run(dbQuery);
      response.send("Due Date Updated");
      break;
    case todo !== "":
      dbQuery = `UPDATE todo SET todo = '${todo}' WHERE id = ${todoId};`;
      await db.run(dbQuery);
      response.send("Todo Updated");
      break;
  }
});

//API 6
app.delete("/todos/:todoId/", validation, async (request, response) => {
  const { todoId } = request.params;
  const dbQuery = `DELETE FROM todo WHERE id = ${todoId};`;
  const dbResponse = await db.run(dbQuery);
  response.send("Todo Deleted");
});

module.exports = app;
