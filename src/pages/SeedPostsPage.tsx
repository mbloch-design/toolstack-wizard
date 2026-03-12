import postsFr from "@/data/posts-fr.json";
import postsEn from "@/data/posts-en.json";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const SeedPostsPage = () => {
  const [status, setStatus] = useState("Ready to seed");
  const [result, setResult] = useState<any>(null);

  const handleSeed = async () => {
    setStatus("Seeding...");
    
    const allPosts = [
      ...postsFr.map((p: any) => ({ ...p, lang: "fr" })),
      ...postsEn.map((p: any) => ({ ...p, lang: "en" })),
    ];

    const { data, error } = await supabase.functions.invoke("seed-content", {
      body: { action: "seed_posts", posts: allPosts },
    });

    if (error) {
      setStatus("Error: " + error.message);
      setResult(error);
    } else {
      setStatus("Done!");
      setResult(data);
    }
  };

  return (
    <div className="container mx-auto max-w-xl py-20">
      <h1 className="text-2xl font-bold mb-4">Seed Posts</h1>
      <p className="mb-4">Status: {status}</p>
      <button onClick={handleSeed} className="bg-primary text-primary-foreground px-4 py-2 rounded">
        Seed All Posts
      </button>
      {result && <pre className="mt-4 text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

export default SeedPostsPage;
