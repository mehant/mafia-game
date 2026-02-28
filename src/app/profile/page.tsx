import type {Metadata} from "next";

export const metadata: Metadata = {
    title: 'About me — Mehant Baid',
};

export default function Profile() {
    return (
        <div className="min-h-screen bg-gray-950 flex justify-center p-8">
            <div className="w-full max-w-md">

                <h1 className="text-3xl font-bold text-white text-center mb-6">
                    About Me
                </h1>

                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                    <p className="text-gray-300 text-sm">
                        👋Hi There!! I am Mehant, a software engineer by day. <br/> <br/>
                        I hope  you enjoy the Mafia game with your friends & family. <br/>
                        <br/>
                        Happy deducing!!
                    </p>
                </div>

            </div>
        </div>

    );
}