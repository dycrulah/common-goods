"use client";

export default function SortSelect({
  defaultValue,
  hidden,
}: {
  defaultValue: string;
  hidden: { name: string; value: string }[];
}) {
  return (
    <form action="/products" method="get">
      {hidden.map((h) => (
        <input key={h.name} type="hidden" name={h.name} value={h.value} />
      ))}
      <select
        name="sort"
        defaultValue={defaultValue}
        className="border bg-transparent px-2 py-1"
        onChange={(e) => e.currentTarget.form?.submit()}
      >
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
      </select>
    </form>
  );
}
