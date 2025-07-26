// components/CategorySection.js
import ToolCard from "./ToolCard";

export default function CategorySection({ category, tools }) {
  return (
    <section className="mb-8">
      <h2 className="text-center text-2xl font-bold mb-8 mt-16">{category}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {tools.map((tool) => (
          <ToolCard
            key={tool?.slug}
            name={tool?.name}
            slug={tool?.slug}
            description={tool?.description}
            icon={tool?.icon}
          />
        ))}
      </div>
    </section>
  );
}
