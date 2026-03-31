import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

function EssayPage() {
  const { id } = useParams();
  const [essay, setEssay] = useState(null);

//   useEffect(() => {
//     console.log("Essay ID:", id);

//     // 暫時用假資料
//     const fakeData = {
//       topic: "My Leadership Journey",
//       content: `When I first joined the debate club...

// Over time, I learned how to lead discussions...

// This experience shaped me...`
//     };

//     setEssay(fakeData);

//   }, [id]);
useEffect(() => {
  const fetchEssay = async () => {
    try {
      const response = await fetch(
        `http://44.201.62.0:8000/essay/${id}`
      );

      const data = await response.json();

      setEssay(data);

    } catch (error) {
      console.error("ERROR:", error);
    }
  };

  fetchEssay();
}, [id]);

  return (
    <div style={{ padding: "40px" }}>
      {essay ? (
        <>
          <h1>{essay.topic}</h1>
          <pre>{essay.content}</pre>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default EssayPage;