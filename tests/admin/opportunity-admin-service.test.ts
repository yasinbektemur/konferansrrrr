import assert from "node:assert/strict";
import { test } from "node:test";
import { OpportunityAdminService } from "@/modules/admin/application/opportunity-admin-service";
import { createTestDatabase } from "../helpers/database";

test("admin create is idempotent and writes relational side effects", () => {
  const database = createTestDatabase();
  database.prepare("INSERT INTO data_sources(id,name,kind,trust_level) VALUES ('source-demo','Manual','manual','verified')").run();
  database.prepare("INSERT INTO users(id,email,display_name,password_hash,role,status) VALUES ('admin','admin@example.test','Admin','hash','owner','active')").run();
  let sequence = 0;
  const service = new OpportunityAdminService(database, { next: () => `generated-${++sequence}` });
  const input = { title:"Klinik Araştırma Çağrısı 2028", type:"grant" as const, summary:"Klinik araştırmalar için uluslararası destek çağrısı.", description:"Ayrıntılı uygunluk ve değerlendirme açıklaması.", officialUrl:"https://example.org/call", deadline:"2028-05-20", deadlineLabel:"Başvuru sonu", confidenceScore:92 };
  const first = service.create(input,"admin","stable-request");
  const second = service.create(input,"admin","stable-request");
  assert.deepEqual(second, first);
  assert.equal(Number((database.prepare("SELECT COUNT(*) count FROM opportunities").get() as {count:number}).count),1);
  assert.equal(Number((database.prepare("SELECT COUNT(*) count FROM deadlines WHERE opportunity_id=?").get(first.id) as {count:number}).count),1);
  assert.equal(Number((database.prepare("SELECT COUNT(*) count FROM audit_logs").get() as {count:number}).count),1);
  assert.equal(Number((database.prepare("SELECT COUNT(*) count FROM outbox_events").get() as {count:number}).count),1);
  database.close();
});
