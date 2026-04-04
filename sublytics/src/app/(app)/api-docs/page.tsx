"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocs() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch("/api/v1/docs")
      .then((res) => res.json())
      .then((data) => setSpec(data));
  }, []);

  if (!spec) {
    return (
      <div className="page-container animate-fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">API Documentation</h1>
            <p className="page-subtitle">Loading interactive API documentation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-auto bg-background">
      <SwaggerUI spec={spec} />
    </div>
  );
}
