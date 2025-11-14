import BidAuctionMyListings from "./components/bid-auction-my-listings";
import Footer from "./components/footer";
import Hero from "./components/hero";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center font-sans dark:bg-black"> 
      <div className="flex flex-col items-center justify-center gap-4 w-full h-full">
        <Hero />
        <BidAuctionMyListings />
        <Footer />
      </div>
    </div>
  );
}
