
import {Car} from '../../scripts/car';


describe('Car class', () => {

    let car;

    beforeEach(() => {
        car = new Car('Toyota', 'red', 'Betsy');
    });

    test('sum: check 1 + 2 = 3', () => {
        expect(car.sum(1,2)).toBe(3)
    });

    test('describeVehicle logs correctly', () => {
        console.log = jest.fn();
        car.describeVehicle();
        expect(console.log).toHaveBeenCalledWith('Your car is a red Toyota named Betsy.');
    });

});

