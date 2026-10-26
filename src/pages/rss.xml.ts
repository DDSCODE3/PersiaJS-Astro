import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getAllArticles, articlesBase } from "../utils/articles";

export async function GET(context: APIContext) {
  const articles = await getAllArticles();

  return rss({
    title: "PersiaJS Articles",
    description:
      "Articles from the PersiaJS community on JavaScript and web development",
    site: context.site!,
    items: articles.map((a) => ({
      title: a.data.title,
      description: a.data.description,
      pubDate: a.data.pubDate,
      link: `${articlesBase(a.data.lang)}/${a.id}/`,
      categories: a.data.tags,
    })),
  });
}
