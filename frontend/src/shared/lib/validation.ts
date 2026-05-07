import { z } from "zod";

export const requiredText = (message: string) => z.string().trim().min(1, message);
