import { Hono } from "hono";
import { Suspense } from "hono/jsx/streaming";
import { Layout } from "./layout";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(Layout);

app.get("/", (c) => {
  return c.render(
    <>
      <header>
        <h1>Anything To Markdown</h1>
      </header>
      <main>
        <p>将各种东西转换为 Markdown 以作为 LLM 的上下文</p>
        <article>
          <form method="post" encType="multipart/form-data" action="/">
            <label htmlFor="uploadFiles">选择文件</label>
            <input
              type="file"
              id="uploadFiles"
              name="uploadFiles"
              accept=".pdf,.jpeg,.jpg,.png,.webp,.svg,.html,.xml,.xlsx,.xlsm,.xlsb,.xls,.et,.ods,.csv,.numbers"
              style="display: none"
              multiple={true}
              onchange="this.form.submit()"
            />
          </form>
        </article>
      </main>
    </>
  );
});

app.post("/", async (c) => {
  const data = await c.req.formData();
  const files = data.getAll("uploadFiles");
  return c.render(
    <>
      <header>
        <h1>
          <a href="/">Anything To Markdown</a>
        </h1>
      </header>
      <main>
        <Suspense fallback={<p>转换中...</p>}>
          <ToMarkdown env={c.env} files={files} />
        </Suspense>
      </main>
    </>
  );
});

async function ToMarkdown({
  env,
  files,
}: {
  env: CloudflareBindings;
  files: (string | File)[];
}) {
  const results = await env.AI.toMarkdown(
    await Promise.all(
      files
        .filter((f) => typeof f !== "string")
        .map(async (f) => ({
          name: f.name,
          blob: new Blob([await f.arrayBuffer()]),
        }))
    )
  );
  const content = results.map((result, i) => (
    <section key={i}>
      <h3>文件名: {result.name}</h3>
      {result.data}
    </section>
  ));
  return <>{content}</>;
}

export default app;
