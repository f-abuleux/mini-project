export default function Pagination({ page, lastpage, setData }: { page: any, lastpage: any, setData: any }) {

    

    const scrollTop = () => {
        scrollTo({
            behavior: "smooth",
            top: 0
        })
    }

    const handleNextPage = () => {
        setData((prevState: any) => prevState + 1)
        scrollTop()
    }

    const handlePrevPage = () => {
        setData((prevState: any) => prevState - 1)
        scrollTop()
    }

    return (
        <div>
            <div className="flex justify-center gap-4">
                <button
                    onClick={handlePrevPage}
                    className="transition-all text-white hover:text-third">
                    Prev
                </button>
                <p className="text-secondary">1 of 10</p>
                <button
                    onClick={handleNextPage}
                    className="transition-all text-white hover:text-third"
                >Next
                </button>
            </div>
        </div>
    )
}