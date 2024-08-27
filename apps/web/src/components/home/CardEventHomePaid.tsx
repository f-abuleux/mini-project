"use client";

import Image from "next/image"
import Link from "next/link"
import { TbArmchair } from "react-icons/tb";
import { useEffect, useState } from "react";
import { Event } from "@/libs/action/event";
import { getCookie } from "@/libs/action/server";
import Pagination from "./Pagination";

// fetch data (client-side)
export default function CardEventHomePaid() {
    const [data, setData] = useState<Event[]>([]);
    const getEvent = async () => {
        const token = await getCookie("token")
        const event = await fetch("http://localhost:8000/api/event/events/paid", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token?.value}`
            },
            // next: { revalidate: 60, tags: ["EventPaid"] }
        })
        const response = await event.json()
        setData(response.data);
    }

    useEffect(() => {
        getEvent()
    }, [])

    return (
        <div >
            <div className="grid grid-cols-3 p-10 gap-3">
            {
                data?.map((event, index) => {
                    return (
                        <div>
                            <div key={index} className="w-full px-6 lg:w-[400px]">
                                <div className="bg-gradient-to-t from-indigo-950 to-gray-500 rounded-xl overflow-hidden shadow-lg mb-10">
                                    <Image src="/eventberbayar.png" alt="Event Ticket" width={1000} height={100} className="w-full" />
                                    <div className="py-12 px-6">
                                        <div className="flex gap-[100px]">
                                            <div>
                                                <h3><p className="font-semibold text-third text-2xl hover:text-secondary truncate w-50">{event.name}</p></h3>
                                                <div>

                                                    <h4 className="font-normal text-secondary pb-2">{event.location}</h4>
                                                </div>
                                            </div>
                                            <div>
                                                {/* <AvatarUserEo /> */}
                                            </div>
                                        </div>
                                        <div className="flex pb-2 gap-1">
                                            <TbArmchair size={22} className="text-white" />
                                            <p className="text-white text-[14px]">- <span>{event.seat} Seat</span></p>
                                        </div>
                                        <p className="text-secondary pb-3 text-sm">{event.date}</p>
                                        <p className="text-secondary pb-3 text-sm">{event.description.substring(0, 100)}</p>
                                        <p className="text-secondary font-semibold">Price</p>
                                        <p className="text-secondary font-semibold pb-10 text-xl">Rp.{event.price}</p>
                                        <Link href={`/event/${event.id}`} className="text-secondary py-3 px-3 pb-3 rounded-xl border border-solid border-secondary hover:bg-gradient-to-l from-third to-primary transition duration-300 ease-in-out">View Event</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })
            }
            </div>
            <div>
                <Pagination page={data} lastpage={data} setData={setData} />
            </div>
        </div>
    )
}