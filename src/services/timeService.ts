import { startOfWeek, lastDayOfWeek } from 'date-fns'

export function mondayOfCurrentWeek(date: Date): Date {
    return startOfWeek(date, { weekStartsOn: 1 })
}

export function sundayOfCurrentWeek(date: Date): Date {
    return lastDayOfWeek(date, { weekStartsOn: 1 })
}