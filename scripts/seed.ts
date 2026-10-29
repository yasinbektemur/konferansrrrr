import './environment';
import { resolve } from "node:path";
import { SqliteDatabase } from "../modules/shared/infrastructure/database/sqlite-database";
import { seedDatabase } from "../modules/shared/infrastructure/database/seed";
const path=resolve(process.env.DATABASE_PATH??"data/app.db"),db=new SqliteDatabase(path);db.migrate();seedDatabase(db);console.log(`Veritabanı hazır: ${path}`);db.close();
