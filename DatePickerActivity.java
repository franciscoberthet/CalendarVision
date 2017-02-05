package com.example.joemi.enghacks;

import android.content.Intent;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.DatePicker;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

import static android.R.attr.value;

public class DatePickerActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_date_picker);

        DatePicker datePicker = (DatePicker) findViewById(R.id.datePicker);

        SharedPreferences sharedPref = PreferenceManager.getDefaultSharedPreferences(DatePickerActivity.this);
        System.out.println("here");
        System.out.println("Date: " + sharedPref.getString("date", "ssqqsqss"));
        Date d = null;
        try {
            d = parse(sharedPref.getString("date", ""));
        } catch (ParseException e) {
            e.printStackTrace();
        }
        System.out.println(d.getTime());
        datePicker.updateDate(d.getYear(), d.getMonth(), d.getDay());

        Button doneButton = (Button)findViewById(R.id.doneButton);

        doneButton.setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                Intent myIntent = new Intent(DatePickerActivity.this, MainActivity.class);
                myIntent.putExtra("key", value); //Optional parameters
                DatePickerActivity.this.startActivity(myIntent);

            }
        });
    }

    public static Date parse(String input ) throws java.text.ParseException {

        //NOTE: SimpleDateFormat uses GMT[-+]hh:mm for the TZ which breaks
        //things a bit.  Before we go on we have to repair this.
        SimpleDateFormat df = new SimpleDateFormat( "yyyy-MM-dd'T'HH:mm:ssz" );

        //this is zero time so we need to add that TZ indicator for
        if ( input.endsWith( "Z" ) ) {
            input = input.substring( 0, input.length() - 1) + "GMT-00:00";
        } else {
            int inset = 6;

            String s0 = input.substring( 0, input.length() - inset );
            String s1 = input.substring( input.length() - inset, input.length() );

            input = s0 + "GMT" + s1;
        }

        return df.parse( input );

    }

}
