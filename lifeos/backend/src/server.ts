import { app } from "./app.js";
import { env } from "./utils/env.js";

app.listen(env.PORT, () => {
  console.log(`LifeOS backend running on http://localhost:${env.PORT}`);
});
