import { startOfWeek, lastDayOfWeek } from 'date-fns'

export function mondayOfWeek(date: Date): Date {
    return startOfWeek(date, { weekStartsOn: 1 })
}

export function sundayOfWeek(date: Date): Date {
    return lastDayOfWeek(date, { weekStartsOn: 1 })
}

export function fridayOfWeek(date: Date): Date {
    const sunday = sundayOfWeek(date)
    return new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() - 2)
}