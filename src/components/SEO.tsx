interface SEOProps {
	title?: string;
	description?: string;
}

export function SEO({
	title = "FASTEST Icon Search Engine",
	description = "Search and download free icons for your applications. Browse our collection of high-quality icons, perfect for UI development.",
}: SEOProps) {
	const keywords = [
		"Icon search engine",
		"Flutter Icons",
		"React Icons",
		"SVG icons",
		"Free icons",
		"Icon library",
		"Material icons",
		"FontAwesome",
		"Feather icons",
		"Bootstrap icons",
		"Heroicons",
		"Ionicons",
		"Octicons",
		"Material Design icons",
		"Ant Design icons",
		"Tailwind icons",
		"Line Awesome",
		"Zondicons",
		"Eva Icons",
		"Iconmonstr",
		"Fluent UI icons",
		"Boxicons",
		"Typicons",
		"Simple Line Icons",
		"Bootstrap icon pack",
		"UI icons collection",
		"Web icons",
		"Vector icons",
		"UI design resources",
	].join(", ");

	const structuredData = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: title,
		url: window.location.href,
		description: description,
		keywords: keywords,
		potentialAction: {
			"@type": "SearchAction",
			target: `${window.location.href}?q={search_term_string}`,
			"query-input": "required name=search_term_string",
		},
	};

	return (
		<>
			<title>{title}</title>
			<meta name="description" content={description} />
			<meta name="keywords" content={keywords} />

			{/* Open Graph / Facebook */}
			<meta property="og:type" content="website" />
			<meta property="og:title" content={title} />
			<meta property="og:description" content={description} />
			<meta
				property="og:url"
				content={window.location.href}
			/>

			{/* Twitter */}
			<meta
				name="twitter:card"
				content="summary_large_image"
			/>
			<meta name="twitter:title" content={title} />
			<meta
				name="twitter:description"
				content={description}
			/>

			{/* Additional SEO meta tags */}
			<meta name="robots" content="index, follow" />
			<meta name="language" content="English" />
			<link rel="canonical" href={window.location.href} />

			{/* Structured Data for SEO */}
			<script type="application/ld+json">
				{JSON.stringify(structuredData)}
			</script>
		</>
	);
}
