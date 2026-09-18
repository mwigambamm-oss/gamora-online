from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import logging

logging.disable(logging.CRITICAL)

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

MODEL = "Helsinki-NLP/opus-mt-en-sw"

print("Inapakia Gamora English → Kiswahili translator...", flush=True)

tokenizer = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL)

print("Translator iko tayari.", flush=True)


def translate(text):
    if not text.strip():
        return ""

    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
    )

    output = model.generate(
        **inputs,
        max_length=512,
        num_beams=4,
        early_stopping=True,
    )

    return tokenizer.decode(
        output[0],
        skip_special_tokens=True,
    ).strip()


class Handler(BaseHTTPRequestHandler):

    def do_POST(self):
        if self.path != "/translate":
            self.send_response(404)
            self.end_headers()
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length)
            data = json.loads(body.decode("utf-8"))

            result = translate(str(data.get("text", "")))

            response = json.dumps(
                {
                    "success": True,
                    "translation": result,
                },
                ensure_ascii=False,
            ).encode("utf-8")

            self.send_response(200)
            self.send_header(
                "Content-Type",
                "application/json; charset=utf-8"
            )
            self.send_header(
                "Content-Length",
                str(len(response))
            )
            self.end_headers()
            self.wfile.write(response)

        except Exception as e:
            response = json.dumps(
                {
                    "success": False,
                    "error": str(e),
                },
                ensure_ascii=False,
            ).encode("utf-8")

            self.send_response(500)
            self.send_header(
                "Content-Type",
                "application/json; charset=utf-8"
            )
            self.send_header(
                "Content-Length",
                str(len(response))
            )
            self.end_headers()
            self.wfile.write(response)

    def log_message(self, format, *args):
        pass


server = HTTPServer(("127.0.0.1", 8766), Handler)

print(
    "GAMORA TRANSLATOR RUNNING ON http://127.0.0.1:8766",
    flush=True
)

server.serve_forever()
