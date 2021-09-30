import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import * as dayjs from 'dayjs';

@ValidatorConstraint()
export class IsValidDay implements ValidatorConstraintInterface {
  validate(value: any) {
    const day = dayjs(value).day();
    return day !== 6 && day !== 7;
  }

  defaultMessage({ property }) {
    return `${property} can\`t be Saturday and Sunday`;
  }
}
