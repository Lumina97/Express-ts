import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";

const app = express();
app.use(express.json());
// All code should go below this line

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);

const checkInput = (input: TDog) => {
  const response: string[] = [];

  if (typeof input.name !== "string")
    response.push("name should be a string");
  if (typeof input.age !== "number")
    response.push("age should be a number");
  if (typeof input.description !== "string")
    response.push("description should be a string");
  if (typeof input.breed !== "string")
    response.push("breed should be a string");

  return response;
};

const validateKeys = (input: TDog) => {
  const result = [];
  for (const [key, _value] of Object.entries(input)) {
    if (
      key !== "name" &&
      key !== "age" &&
      key !== "breed" &&
      key !== "description"
    ) {
      result.push(`'${key}' is not a valid key`);
    }
  }
  return result;
};

app.get("/", (_req, res) => {
  res.json({ message: "Hello World!" }).status(200);
});

app.get("/dogs", async (_req, res) => {
  prisma.dog
    .findMany()
    .then((result) => {
      res.status(200).send(result);
    })
    .catch(() => {
      res.status(400).send();
    });
});

app.get("/dogs/:id", async (req, res) => {
  const givenID = +req.params.id;
  if (isNaN(givenID)) {
    res
      .status(400)
      .send({ message: "id should be a number" });
    return;
  }

  prisma.dog
    .findUnique({
      where: {
        id: givenID,
      },
    })
    .then((result) => {
      if (result) {
        res.status(200).send(result);
      } else {
        res.status(204).send(`No data`);
      }
    })
    .catch(() => {
      res.status(204).send(`No data`);
    });
});

app.delete("/dogs/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id);
  if (isNaN(id)) {
    res
      .status(400)
      .send({ message: "id should be a number" });
    return;
  }
  await prisma.dog
    .delete({
      where: {
        id: id,
      },
    })
    .then((result) => {
      res.status(200).send(result);
    })
    .catch(() => {
      res.status(204).send();
    });
});

type TDog = {
  name: string;
  description: string;
  age: number;
  breed: string;
};

app.post("/dogs", async (req, res) => {
  const dog = req.body;
  let validateInput = checkInput(dog);
  const keys = validateKeys(dog);
  if (keys.length > 0)
    validateInput = validateInput.concat(keys);
  if (validateInput.length > 0) {
    res.status(400).send({ errors: validateInput });
    return;
  }

  prisma.dog
    .create({
      data: {
        name: dog.name,
        description: dog.description,
        age: dog.age,
        breed: dog.breed,
      },
    })
    .then((result) => {
      res.status(201).send(result);
    });
});

app.patch("/dogs/:id", async (req, res) => {
  const id = Number.parseInt(req.params.id);
  if (isNaN(id)) {
    res
      .status(400)
      .send({ message: "id should be a number" });
    return;
  }

  const dog = req.body;
  const keys = validateKeys(dog);
  if (keys.length > 0) {
    res.status(400).send({ errors: keys });
    return;
  }

  await prisma.dog
    .update({
      where: {
        id: +req.params.id,
      },
      data: dog,
    })
    .then((result) => {
      res.status(201).send(result);
    })
    .catch((error) => {
      res.status(400).send({ errors: error });
    });
});

// all your code should go above this line
app.use(errorHandleMiddleware);
