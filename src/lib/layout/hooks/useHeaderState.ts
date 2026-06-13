import { useState } from "react"

export function useHeaderState() {
    const [notificationAmount, setNotificationAmount] = useState(0)
    return { notificationAmount, setNotificationAmount }
}
