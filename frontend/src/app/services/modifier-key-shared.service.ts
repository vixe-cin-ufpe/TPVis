import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ModifierKeySharedService {

  public isControlKeyDown: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor() { }
}
