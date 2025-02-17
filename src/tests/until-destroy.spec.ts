import {
  ɵComponentDef as ComponentDef,
  ɵɵdefineComponent as defineComponent
} from '@angular/core';
import { interval, Subject } from 'rxjs';

import { UntilDestroy } from '..';

describe('UntilDestroy decorator alone', () => {
  it('should unsubscribe from the subscription property', () => {
    @UntilDestroy({ checkProperties: true })
    class TestComponent {
      static ɵcmp: ComponentDef<TestComponent> = defineComponent({
        vars: 0,
        decls: 0,
        type: TestComponent,
        selectors: [[]],
        template: () => {}
      });

      subscription = interval(1000).subscribe();

      static ɵfac = () => new TestComponent();
    }

    const component = TestComponent.ɵfac();

    expect(component.subscription.closed).toBeFalsy();

    TestComponent.ɵcmp.onDestroy!.call(component);

    expect(component.subscription.closed).toBeTruthy();
  });

  it('should not unsubscribe from the blacklisted subscription', () => {
    @UntilDestroy({ blackList: ['subjectSubscription'], checkProperties: true })
    class TestComponent {
      static ɵcmp: ComponentDef<TestComponent> = defineComponent({
        vars: 0,
        decls: 0,
        type: TestComponent,
        selectors: [[]],
        template: () => {}
      });

      intervalSubscription = interval(1000).subscribe();
      subjectSubscription = new Subject().subscribe();

      static ɵfac = () => new TestComponent();
    }

    const component = TestComponent.ɵfac();

    expect(component.intervalSubscription.closed).toBeFalsy();
    expect(component.subjectSubscription.closed).toBeFalsy();

    TestComponent.ɵcmp.onDestroy!.call(component);

    expect(component.intervalSubscription.closed).toBeTruthy();
    expect(component.subjectSubscription.closed).toBeFalsy();

    component.subjectSubscription.unsubscribe();
  });

  it('should unsubscribe from the array of subscriptions', () => {
    @UntilDestroy({ arrayName: 'subscriptions' })
    class TestComponent {
      static ɵcmp: ComponentDef<TestComponent> = defineComponent({
        vars: 0,
        decls: 0,
        type: TestComponent,
        selectors: [[]],
        template: () => {}
      });

      subscriptions = [interval(1000).subscribe(), new Subject().subscribe()];

      static ɵfac = () => new TestComponent();
    }

    const component = TestComponent.ɵfac();

    component.subscriptions.forEach(subscription => {
      expect(subscription.closed).toBeFalsy();
    });

    TestComponent.ɵcmp.onDestroy!.call(component);

    component.subscriptions.forEach(subscription => {
      expect(subscription.closed).toBeTruthy();
    });
  });
});
