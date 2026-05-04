type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  highlight: string;
  subtitle: string;
};

export function SectionHeading({ eyebrow, title, highlight, subtitle }: SectionHeadingProps) {
  return (
    <div className="mx-auto mb-16 max-w-4xl text-center">
      {eyebrow ? <p className="mb-3 text-sm font-medium text-blue-300">{eyebrow}</p> : null}
      <h2 className="text-4xl font-bold tracking-normal text-foreground md:text-6xl">
        {title}{" "}
        <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {highlight}
        </span>
      </h2>
      <p className="mx-auto mt-5 max-w-3xl text-lg text-muted-foreground md:text-xl">{subtitle}</p>
    </div>
  );
}
