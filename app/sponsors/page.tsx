"use client"

import Image from "next/image"
import Link from "next/link"
import FadeInView from "@/components/FadeInView"

export default function SponsorsPage() {
	const sponsors = [
		{
			name: "Cubefore overseas education",
			logo: "/cubefore.png",
			site: "https://www.cubefore.com/",
		},
		{
			name: "GDG Hyderabad",
			logo: "/gdg-hyd.png",
			site: "https://gdg.community.dev/gdg-hyderabad/",
		}
	]

	return (
		<div className="min-h-screen w-screen bg-black flex flex-col items-center justify-center p-8 py-24">
			<FadeInView>
				<div className="flex flex-col items-center gap-16 max-w-6xl w-full">
					<h1 className="text-white text-5xl md:text-7xl font-black font-kanit italic uppercase tracking-tighter text-center">
						Our Sponsors
					</h1>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20">
						{sponsors.map((sponsor) => (
							<Link
								key={sponsor.name}
								href={sponsor.site}
								target="_blank"
								rel="noopener noreferrer"
								className="group relative flex flex-col items-center gap-6 transition-all duration-500"
							>
								<div className="relative bg-white p-6 md:p-10 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_70px_rgba(255,255,255,0.15)] transition-all duration-500 flex items-center justify-center">
									<div className="relative w-64 h-32 md:w-80 md:h-40">
										<Image
											src={sponsor.logo}
											alt={sponsor.name}
											fill
											className="object-contain"
											priority
										/>
									</div>
								</div>

								<h2 className="text-white text-2xl md:text-3xl font-bold font-kanit tracking-tight group-hover:text-purple-400 transition-colors text-center">
									{sponsor.name}
								</h2>
							</Link>
						))}
					</div>
				</div>
			</FadeInView>
		</div>
	)
}
