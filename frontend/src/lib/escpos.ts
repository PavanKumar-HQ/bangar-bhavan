import { Order, ShopSettings } from '../types';

export class EscPosBuilder {
  private buffer: number[] = [];

  constructor() {
    this.reset();
  }

  reset(): this {
    this.buffer.push(0x1b, 0x40); // ESC @ Initialize
    return this;
  }

  alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01);
    return this;
  }

  alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00);
    return this;
  }

  alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02);
    return this;
  }

  bold(enable: boolean = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  doubleSize(enable: boolean = true): this {
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00); // 2x width, 2x height
    return this;
  }

  text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  line(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0a); // Linefeed
    return this;
  }

  divider(char: string = '-'): this {
    this.line(char.repeat(32));
    return this;
  }

  tableRow(col1: string, col2: string, col3: string, width: number = 32): this {
    // col1: Dish name (max 18 chars), col2: Qty (max 4 chars), col3: Price (max 8 chars)
    let c1 = col1.substring(0, 18).padEnd(18, ' ');
    let c2 = col2.padStart(4, ' ');
    let c3 = col3.padStart(10, ' ');
    this.line(`${c1}${c2}${c3}`);
    return this;
  }

  feed(lines: number = 3): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  cut(): this {
    this.feed(3);
    this.buffer.push(0x1d, 0x56, 0x00); // GS V 0 Cut
    return this;
  }

  getUint8Array(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

export const buildReceiptBuffer = (order: Order, settings?: ShopSettings): Uint8Array => {
  const builder = new EscPosBuilder();
  const shopName = settings?.shopName || 'BANGAR BHAVAN CHATS';
  const address = settings?.address || 'Near Central Bus Stand, Bengaluru';
  const phone = settings?.phone || '+91 98765 43210';
  const footer = settings?.footerText || 'Thank You! Visit Again!';

  const orderDate = new Date(order.createdAt);
  const dateStr = orderDate.toLocaleDateString('en-IN');
  const timeStr = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  builder
    .alignCenter()
    .doubleSize(true)
    .bold(true)
    .line(shopName.toUpperCase())
    .doubleSize(false)
    .bold(false)
    .line(address)
    .line(`Ph: ${phone}`)
    .divider('=')
    .alignLeft()
    .bold(true)
    .line(`Bill No: ${order.invoiceNo}`)
    .line(`Date: ${dateStr}   Time: ${timeStr}`)
    .line(`Mode: ${order.paymentMode} ${order.isParcel ? '[PARCEL]' : ''}`)
    .bold(false)
    .divider('-')
    .tableRow('ITEM', 'QTY', 'AMOUNT')
    .divider('-');

  order.items.forEach((item) => {
    const itemTotal = (item.quantity * item.price).toFixed(0);
    builder.tableRow(item.name, `${item.quantity}`, `Rs.${itemTotal}`);
  });

  builder.divider('-');

  builder
    .alignRight()
    .line(`Subtotal: Rs.${order.subtotal.toFixed(0)}`);

  if (order.isParcel && order.parcelCharge > 0) {
    builder.line(`Parcel Charge: Rs.${order.parcelCharge.toFixed(0)}`);
  }

  builder
    .bold(true)
    .doubleSize(true)
    .line(`TOTAL: Rs.${order.grandTotal.toFixed(0)}`)
    .doubleSize(false)
    .bold(false)
    .divider('=')
    .alignCenter()
    .bold(true)
    .line(footer)
    .bold(false)
    .line('--- Pure Fast Billing ---')
    .cut();

  return builder.getUint8Array();
};
