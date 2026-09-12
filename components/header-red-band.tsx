import Image from "next/image"

export function RedBand() {
  return (
    <div className="h-20 md:h-24 lg:h-28 w-[110%] -translate-x-[5%] bg-[#E91B2F] overflow-visible relative -rotate-3 mt-15">
      <div className="h-full w-full py-1">
        <div className="h-full w-full bg-[url('/red-band-design.svg')] bg-repeat-x bg-size-[auto_100%] bg-left" />
      </div>

      <div className="absolute inset-0 py-1 px-6 md:px-12 lg:px-20 xl:px-36">
        <div className="h-full w-full flex items-center justify-between gap-1 md:gap-4">
          <div className="h-full shrink-0">
            <Image
              src="/Gallery/highlights-text.svg"
              alt="Highlights"
              width={200}
              height={100}
              className="h-[85%] md:h-[110%] lg:h-[120%] w-auto object-contain -translate-y-0.5 md:-translate-y-2"
              priority
            />
          </div>

          <div className="h-full shrink-0 absolute lg:top-0 top-14 lg:left-0 left-24 lg:relative">
            <Image
              src="/Gallery/band-text.svg"
              alt="Band Text"
              width={160}
              height={100}
              className="h-[70%] md:h-[90%] lg:h-full w-auto object-contain"
              priority
            />
          </div>

          <div className="h-[160%] md:h-[220%] lg:h-[250%] shrink-0">
            <Image
              src="/Gallery/hb3.svg"
              alt="TRI-CITY AI HACKATHON"
              width={180}
              height={90}
              className="h-full w-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}
