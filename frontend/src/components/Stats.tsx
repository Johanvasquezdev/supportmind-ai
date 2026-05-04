const stats = [
  { value: "99%", label: "Customer Satisfaction", description: "Rated by 10,000+ users" },
  { value: "2M+", label: "Conversations Handled", description: "Every single month" },
  { value: "60%", label: "Cost Reduction", description: "Average savings reported" },
  { value: "24/7", label: "Always Available", description: "Never miss a customer" },
];

export function Stats() {
  return (
    <section className="border-y border-border/60 py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 text-center sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-6xl font-bold text-transparent md:text-7xl">
              {stat.value}
            </p>
            <h3 className="mt-6 text-2xl font-semibold text-foreground">{stat.label}</h3>
            <p className="mt-3 text-muted-foreground">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
