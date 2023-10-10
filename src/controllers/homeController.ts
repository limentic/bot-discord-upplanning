import { Request, Response } from "express";

export const homeController = (req: Request, res: Response) => {
  res.send("Hello, this is the home controller!");
};
