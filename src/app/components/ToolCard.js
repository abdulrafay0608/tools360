import Link from "next/link";

export default function ToolCard({ name, slug, description, icon }) {
  return (
    <Link
      href={`/tools/${slug}`}
      className="group block bg-white rounded border border-gray-100 shadow-md hover:shadow-lg transition-all duration-500 ease-in-out p-5 transform hover:-translate-y-1 hover:scale-105"
    >
      {/* SVG icon from public/icons */}
      <div className="flex justify-center mb-3">
        {/* <img
          src={`/icons/${icon}.svg`}
          className="size-16"
          alt={`${name} icon`}
        /> */}
      </div>
      <div className="flex items-center justify-center h-14 w-14 bg-blue-100 text-blue-600 rounded-full text-xl font-bold transition-all duration-300 group-hover:rotate-6">
        {/* Replace with icon later */}
        {name.charAt(0)}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
        {name}
      </h3>

      <p className="mt-1 text-sm text-gray-600 leading-snug group-hover:text-gray-700 transition-colors duration-200">
        {description}
      </p>
    </Link>
  );
}
