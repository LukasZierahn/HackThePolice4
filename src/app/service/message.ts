import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export default class MessageService {
    private subject = new Subject<any>();

    sendMessage(selectedDate: Date) {
        this.subject.next({ date: selectedDate });
    }

    clearMessage() {
        this.subject.next();
    }

    getMessage(): Observable<{date: Date}> {
        return this.subject.asObservable();
    }
}