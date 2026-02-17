'use client'

import { useEffect, useState } from 'react'

interface WordRotateProps {
    words: string[]
    duration?: number
    className?: string
}

export function WordRotate({
    words,
    duration = 2500,
    className,
}: WordRotateProps) {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % words.length)
        }, duration)

        return () => clearInterval(interval)
    }, [words, duration])

    return (
        <div className="overflow-hidden py-2">
            <div
                className={className}
                key={index}
            >
                <span className="block animate-in slide-in-from-bottom-4 fade-in duration-500">
                    {words[index]}
                </span>
            </div>
        </div>
    )
}
