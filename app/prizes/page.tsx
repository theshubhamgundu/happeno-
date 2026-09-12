
import Image from "next/image"
import FadeInView from "@/components/FadeInView"

export default function PrizesPage() {

	return (
		<div className="w-screen min-h-svh overflow-x-hidden">
			<div className="-z-10 sm:h-[95vh] h-[45vh] w-screen relative overflow-hidden">
				<Image
					src="/sponsers_bg.svg"
					alt=""
					fill
					priority
					className="object-cover object-top"
					sizes="100vw"
				/>

				<div className="absolute inset-0 flex sm:flex-row w-screen flex-col items-center sm:justify-between justify-center lg:px-0 xl:gap-40 z-20">
					<div className="w-[98%] sm:self-center self-start sm:w-[70%] md:w-[70%] lg:w-[60%] xl:w-[60%] z-20">
						<FadeInView delay={0.2}>
							<Image
								src="/prizes_page_heading.svg"
								alt="Prizes for the winners"
								width={574}
								height={158}
								className="w-full h-auto object-contain object-center hidden sm:block"
								priority
							/>
							<Image
								src="/PRIZES FOR THE WINNERS mobile.svg"
								alt="Prizes for the winners"
								width={574}
								height={158}
								className="w-full h-auto object-contain object-center sm:hidden block"
								priority
							/>
						</FadeInView>
					</div>

					<div className="w-[35%] sm:block hidden sm:self-center self-end sm:w-[30%] md:w-[25%] lg:w-[25%] xl:w-[10%]sm:mr-40 md:mr-15 lg:mr-30 xl:mr-40">
						<span className="font-kanit font-black italic text-3xl text-[#FFEE00]">TRICITY</span>
					</div>
				</div>
			</div>

			<div className="min-h-screen w-screen bg-[url('/bg%20texture%20prizes.svg'),radial-gradient(circle_at_center,_#A823DC_0%,_#3F0063_70%)] bg-cover bg-center bg-no-repeat relative flex flex-col items-center pt-[22vw] sm:pt-25 md:pt-30 lg:pt-40 xl:pt-56 pb-30">
				<Image
					src="/MLH PINS.svg"
					alt="MLH pins"
					className="w-[56vw]  sm:w-70 md:w-90 lg:w-120 xl:w-130 right-[10vw] z-20 top-[11vw] absolute object-cover object-top"
					width={100}
					height={100}
					loading="lazy"
				/>

				<div className="w-full h-32 absolute z-10 bg-amber-300/300 -top-[14.9vw]">
					<Image
						src="/stats-upper-2.svg"
						alt="Decorative glass design"
						className="w-full object-cover object-top"
						width={100}
						height={100}
						loading="lazy"
					/>
				</div>

				<div className="w-full flex flex-col items-start justify-start z-20">
					<Image
						src="/first prize.svg"
						alt="First prize banner"
						className="w-full object-cover object-top sm:block hidden"
						width={846}
						height={197}
						loading="lazy"
					/>
					<Image
						src="/first prize mobile.svg"
						alt="First prize banner"
						className="w-full object-cover object-top sm:hidden block"
						width={846}
						height={197}
						loading="lazy"
					/>
					<Image
						src="/2nd prize.svg"
						alt="Second prize banner"
						className="w-full object-cover object-top -mt-[10vw] sm:-mt-40 md:-mt-60 lg:-mt-65 xl:-mt-80 hidden sm:block"
						width={846}
						height={7}
						loading="lazy"
					/>
					<Image
						src="/second and third prize.svg"
						alt="Second and third prize banner"
						className="w-full object-cover object-top -mt-[35vw] sm:-mt-40 md:-mt-60 lg:-mt-65 xl:-mt-80 sm:hidden block"
						width={846}
						height={7}
						loading="lazy"
					/>

					<Image
						src="/girls team and 1st time hackers mobile.svg"
						alt="Girls team and first-time hackers prize banner"
						className="w-[90vw] object-cover object-top ml-[10vw] -mt-[10vw] sm:hidden block"
						width={846}
						height={7}
						loading="lazy"
					/>
					<Image
						src="/girls team and first time.svg"
						alt="Girls team and first-time hackers prize banner"
						className="w-full object-cover object-top ml-10 -mt-15 hidden sm:block"
						width={846}
						height={7}
						loading="lazy"
					/>
				</div>
			</div>
		</div>
	)
}
