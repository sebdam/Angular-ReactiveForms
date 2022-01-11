import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

import { Customer } from './customer';


function frenchPhoneNumberValidator(c:AbstractControl): {[key: string]: Boolean} | null {
  const regex = new RegExp('^(0|\\+33)(\\(0\\))?(6|7)[0-9]{8}$');
  
  if(c.value !== null && String(c.value).length>0  && !regex.test(String(c.value))) {
    return {'frenchPhoneNumberFormat': true};
  }
  return null;
}

function areEqual(a: string, b:string): ValidatorFn {
  return (c:AbstractControl): {[key: string]: Boolean} | null => {
    let a = c.get('email');
    let b = c.get('confirmEmail');

    if(a?.pristine || b?.pristine){
      return null;
    }

    if(a?.value === b?.value) {
      return null;
    }
    return {'equals': true};
  }
}

const validationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid value',
  equals: 'This field does not match its comparison field',
  minlength: 'This field is too short',
  maxlength: 'This field is too long',
  frenchPhoneNumberFormat: 'This field value is not according to french mobile phone format'
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customerForm!: FormGroup;
  customer = new Customer();
  firstNameMessage?: string;
  lastNameMessage?: string;
  phoneMessage?: string;
  emailMessage?: string;
  confirmEmailMessage?: string;

  get addresses(): FormArray {
    return <FormArray>this.customerForm.get('addresses');
  }

  constructor(private formBuilder: FormBuilder) { 
  }

  ngOnInit(): void {
    this.customerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.formBuilder.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: [''],
      }, {validator: areEqual('email','confirmEmail')}),
      phone: [''],
      notification: ['email'],
      sendCatalog: true,
      addresses: this.formBuilder.array([this.buildAddress()])
    });

    this.customerForm.get('notification')?.valueChanges.subscribe(
      value => this.setNotification(value)
    );

    const firstNameControl = this.customerForm.get('firstName');
    firstNameControl?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.firstNameMessage = this.setMessage(firstNameControl)
    );

    const lastNameControl = this.customerForm.get('lastName');
    lastNameControl?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.lastNameMessage = this.setMessage(lastNameControl)
    );

    const phoneControl = this.customerForm.get('phone');
    phoneControl?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.phoneMessage = this.setMessage(phoneControl)
    );

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.emailMessage = this.setMessage(emailControl)
    );

    const emailGroup = this.customerForm.get('emailGroup');
    emailGroup?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(
      value => this.confirmEmailMessage = this.setMessage(emailGroup)
    );
  }

  buildAddress(): FormGroup {
    return this.formBuilder.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    });
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  removeAddressAt(i:number): void {
    this.addresses.removeAt(i);
  }

  save(): void {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    if(notifyVia === 'text'){
      phoneControl?.setValidators([Validators.required, frenchPhoneNumberValidator])
    }
    else {
      phoneControl?.clearValidators();
    }
    phoneControl?.updateValueAndValidity();
  }

  setMessage(c: AbstractControl): string  {
    let message = '';
    if((c.touched || c.dirty) && c.errors){
      console.log('error',c.errors);
      message = Object.keys(c.errors).map(
        key => validationMessages[key as keyof typeof validationMessages]).join(' ');
    }
    return message;
  }
}