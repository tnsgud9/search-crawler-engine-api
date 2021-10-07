import express from "express";
import { KMR } from "koalanlp/API";
import { Tagger } from "koalanlp/proc";
import { Model, Op } from "sequelize";
import sequelize from 'sequelize';
import { Keyword } from "../models/Keyword";
import { Link } from "../models/Link";

const router = express.Router();

type FrequentLink = {
  url:string;
  content:string;
  count:number;
}


router.get("/",async (req,res)=>{
    
    const {q} = req.query;
    if(!q){
        return res.status(400).json();
    }
    //const parser = new Parse();

    // parser.parseKeywords(q.toString());
    const tagger = new Tagger(KMR);
    const tagged = await tagger(q);
    const searchKeywords: Set<string> = new Set();

    for (const sent of tagged) {
      for (const word of sent._items) {
        for (const morpheme of word._items) {
          if (
            morpheme._tag === "NNG" ||
            morpheme._tag === "NNP" ||
            morpheme._tag === "NNB" ||
            morpheme._tag === "NP" ||
            morpheme._tag === "NR" ||
            morpheme._tag === "VV" ||
            morpheme._tag === "SL"
          ) {
            const keyword = morpheme._surface.toLowerCase();
            searchKeywords.add(keyword);
          }
        }
      }
    }
    const keywords = await Keyword.findAll({
      where: {
        name:{
          [Op.in]: Array.from(searchKeywords.values()),
        }
      },
      include:[Link],
    });

    const frequentLink = new Map<string, FrequentLink>();
    keywords.forEach((keyword)=>{
      keyword.links.forEach((link)=>{
        const exist = frequentLink.get(link.url);
        if(exist){
          exist.count += 1;
          frequentLink.set(link.url, exist);
        }else{
          frequentLink.set(link.url, {
            url:link.url,
            content:link.description,
            count : 1,
          });
        }
      });
    });

    const result = Array.from(frequentLink.values()).sort(
      (link1,link2)=>link2.count - link1.count
    );

    return res.status(200).json(result);
});

export default router;