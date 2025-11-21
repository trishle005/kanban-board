'use client';

import {Card, CardContent, CardHeader, CardTitle, CardDescription} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import { useEffect } from "react";


export default function AboutPage() {
    const handleClick = () => {
        console.log("clicked");
    };
    useEffect(() => {
        console.log("API Base:", process.env.NEXT_PUBLIC_API_BASE);
    }, []);

    useEffect(() => {
        document.title = "About - Kanban Board";
    }, []);

    return (
        <div className="p-6">
            <Card className="w-[400px] mx-auto">
                <CardHeader>
                    <CardTitle>About</CardTitle>
                    <CardDescription>This is a profile card.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleClick}>Click Me</Button>
                </CardContent>
            </Card>

        </div>
    );
}