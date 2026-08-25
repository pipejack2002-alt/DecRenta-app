import assert from "node:assert/strict";
import { test } from "node:test";
import { ET_ARTS, ET_INDEX, etChapterFor, searchEt, senadoArt } from "./estatuto-index.ts";

test("el índice cubre residencia, cedular, retención y UVT", () => {
  assert.ok(ET_INDEX.some((c) => c.id === "l1-suj"));
  assert.ok(ET_INDEX.some((c) => c.id === "l1-ced"));
  assert.ok(ET_INDEX.some((c) => c.id === "l2-ret"));
  assert.ok(ET_INDEX.some((c) => c.id === "uvt"));
  assert.ok(etChapterFor(336)?.id === "l1-ced");
  assert.ok(etChapterFor(387)?.id === "l2-ret");
  assert.match(senadoArt(336), /estatuto_tributario\.html#336/);
});

test("buscar 336 y vivienda encuentra artículos ancla", () => {
  const byNum = searchEt("336");
  assert.ok(byNum.arts.some((a) => a.n === 336));
  assert.ok(byNum.chapters.some((c) => c.id === "l1-ced"));
  const viv = searchEt("vivienda");
  assert.ok(viv.arts.some((a) => a.n === 119));
  assert.ok(ET_ARTS.length > 50);
});
